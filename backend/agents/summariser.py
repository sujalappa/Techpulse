import httpx
import os
from schemas import Item

async def scrape_url(url: str, firecrawl_key: str) -> str | None:
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            res = await client.post(
                "https://api.firecrawl.dev/v1/scrape",
                headers={"Authorization": f"Bearer {firecrawl_key}"},
                json={"url": url, "formats": ["markdown"]},
            )
            if res.status_code == 200:
                data = res.json()
                if data.get("success") and "data" in data:
                    return data["data"].get("markdown")
    except Exception as e:
        print(f"Error scraping with Firecrawl for {url}: {e}")
    return None

async def hf_summarize(text: str, token: str) -> str | None:
    model_id = "mistralai/Mistral-7B-Instruct-v0.2"
    url = f"https://api-inference.huggingface.co/models/{model_id}"
    
    truncated_text = text[:4000]
    prompt = f"<s>[INST] Summarize the key announcement, news, or technical finding in this article in 2-3 clean, professional sentences. Focus on developer relevance and technology stack details. Do not include markdown formatting or links. Article text:\n\n{truncated_text} [/INST]"
    
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            res = await client.post(
                url,
                headers={"Authorization": f"Bearer {token}"},
                json={
                    "inputs": prompt,
                    "parameters": {"max_new_tokens": 150, "temperature": 0.3},
                    "options": {"wait_for_model": True}
                }
            )
            if res.status_code == 200:
                output = res.json()
                if isinstance(output, list) and len(output) > 0:
                    gen_text = output[0].get("generated_text", "")
                    if prompt in gen_text:
                        summary = gen_text.replace(prompt, "").strip()
                    else:
                        summary = gen_text.split("[/INST]")[-1].strip()
                    return summary
    except Exception as e:
        print(f"Error summarizing with HuggingFace: {e}")
    return None

async def summarise(items: list[Item]) -> list[Item]:
    hf_token = os.getenv("TECHPULSE_HUGGINGFACEHUB_API_TOKEN") or os.getenv("HUGGINGFACEHUB_API_TOKEN")
    firecrawl_key = os.getenv("TECHPULSE_FIRECRAWL_API_KEY") or os.getenv("FIRECRAWL_API_KEY")
    
    for item in items:
        source_text = item.summary or ""
        
        if not source_text and firecrawl_key:
            print(f"Scraping content for: {item.title}")
            scraped = await scrape_url(item.url, firecrawl_key)
            if scraped:
                source_text = scraped
                
        if source_text and hf_token:
            print(f"Generating summary for: {item.title}")
            summary = await hf_summarize(source_text, hf_token)
            if summary:
                item.summary = summary
                continue
                
        if not item.summary or len(item.summary) < 20:
            item.summary = (
                f"We detected significant interest in '{item.title}' from conversations on {item.source}. "
                "This signal is worth tracking as it indicates early adoption and technical momentum in its category."
            )
            
    return items

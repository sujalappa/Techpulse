import type { Checkpoint as CheckpointType } from "../types";
import { ApprovalPanel } from "../components/ApprovalPanel";

type Props = {
  checkpoint: CheckpointType | null;
  approving: boolean;
  onApprove: (selectedItemIds?: string[]) => void;
};

export function Checkpoint({ checkpoint, approving, onApprove }: Props) {
  return <ApprovalPanel checkpoint={checkpoint} approving={approving} onApprove={onApprove} />;
}

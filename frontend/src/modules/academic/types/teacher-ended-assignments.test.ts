import type { Teacher } from "./academic";

// Ended assignments retain the class summary shape without entering current arrays.
const endedAssignments = {
  ended_classes: [{ id: 1, code: "L01", name: "Lớp 1", subject_id: null, subject_name: null, status: 1 }],
  ended_assistant_classes: [{ id: 2, code: "L02", name: "Lớp 2", subject_id: null, subject_name: null, status: 1 }],
} satisfies Pick<Teacher, "ended_classes" | "ended_assistant_classes">;

const legacyAssignments = {} satisfies Pick<Teacher, "ended_classes" | "ended_assistant_classes">;

void endedAssignments;
void legacyAssignments;

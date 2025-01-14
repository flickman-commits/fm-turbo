export type TaskType = 'proposal' | 'outreach' | 'runOfShow' | 'followUp';

export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number';
  placeholder?: string;
  options?: { label: string; value: string }[];
  required?: boolean;
}

export interface TaskConfig {
  title: string;
  description: string;
  fields: FormField[];
  promptTemplate: string;
}

export interface TaskResult {
  content: string;
  timestamp: Date;
  taskType: TaskType;
} 
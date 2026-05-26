export interface Book {
  id: number;
  title: string;
  author: string;
  status: 'to-read' | 'reading' | 'done';
}

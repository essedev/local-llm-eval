export type BookStatus = 'to-read' | 'reading' | 'done';

export interface Book {
  id: number;
  title: string;
  author: string;
  status: BookStatus;
}

export interface BookCreate {
  title: string;
  author: string;
  status: BookStatus;
}

export interface BookUpdate {
  title?: string;
  author?: string;
  status?: BookStatus;
}

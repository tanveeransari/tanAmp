export interface MediaFile {
  name: string;
  filename: string;
  type: string;
  format: string;
  size: number;
  duration?: number;
  artist?: string;
  album?: string;
  title?: string;
}

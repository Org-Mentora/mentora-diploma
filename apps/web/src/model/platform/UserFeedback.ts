export interface UserFeedback {
  success(message: string): void;
  error(message: string): void;
  warning(message: string): void;
}

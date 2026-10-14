type ErrorMessageProps = {
  message?: string | null;
};

export function ErrorMessage({ message }: ErrorMessageProps) {
  if (!message) return null;
  return <div className="form-error">{message}</div>;
}


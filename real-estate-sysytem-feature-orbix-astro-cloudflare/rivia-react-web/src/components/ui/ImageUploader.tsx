type ImageUploaderProps = {
  label: string;
  multiple?: boolean;
  onChange: (files: File[]) => void;
};

export function ImageUploader({ label, multiple = false, onChange }: ImageUploaderProps) {
  return (
    <label className="field uploader">
      <span className="field-label">{label}</span>
      <span className="upload-box">
        <span>اختيار الصور</span>
        <input
          type="file"
          accept="image/*"
          multiple={multiple}
          onChange={(event) => onChange(Array.from(event.target.files || []))}
        />
      </span>
    </label>
  );
}


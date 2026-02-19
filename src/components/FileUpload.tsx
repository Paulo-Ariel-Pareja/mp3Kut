import { useRef } from 'react';
import { Upload, FileAudio } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
}

export const FileUpload = ({ onFileSelect, isLoading }: FileUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      onFileSelect(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('audio/')) {
      onFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="border-2 border-dashed border-gray-600 rounded-lg p-12 text-center cursor-pointer hover:border-blue-500 transition-colors bg-gray-800"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {isLoading ? (
        <div className="space-y-4">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-600 border-t-blue-500"></div>
          <p className="text-gray-400">Cargando archivo...</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-blue-600 rounded-full">
              <FileAudio className="w-12 h-12 text-white" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xl font-semibold text-white">
              Selecciona un archivo de audio
            </p>
            <p className="text-gray-400">
              Arrastra y suelta o haz clic para seleccionar
            </p>
            <p className="text-sm text-gray-500">MP3, WAV, OGG, etc.</p>
          </div>
          <div className="flex justify-center">
            <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Seleccionar Archivo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

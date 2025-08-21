import React from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { 
  selectedFilePathAtom, 
  selectedFileInfoAtom, 
  openDirectoryDialogAtom, 
  clearFileSelectionAtom,
  fileSelectionErrorAtom,
  isFileDialogOpenAtom
} from './store';

const WatchDir: React.FC = () => {
  const [selectedFilePath, setSelectedFilePath] = useAtom(selectedFilePathAtom);
  const selectedFileInfo = useAtomValue(selectedFileInfoAtom);
  const [, openDirectoryDialog] = useAtom(openDirectoryDialogAtom);
  const [, clearFileSelection] = useAtom(clearFileSelectionAtom);
  const fileSelectionError = useAtomValue(fileSelectionErrorAtom);
  const isFileDialogOpen = useAtomValue(isFileDialogOpenAtom);

  const handlePathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFilePath(e.target.value);
  };

  const handleBrowseClick = () => {
    openDirectoryDialog('Select a directory to watch');
  };

  const handleClearSelection = () => {
    clearFileSelection();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFileInfo?.isDirectory) {
      // TODO: Implement directory watching logic
      console.log('Watching directory:', selectedFilePath);
    }
  };

  return (
    <div className="p-4">
      <h2 className="font-pkmnem font-bold text-xl mb-4">Watch Directory</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="filePath" className="font-pkmnem font-bold block mb-2">
            Directory Path
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              id="filePath"
              value={selectedFilePath}
              onChange={handlePathChange}
              placeholder="Enter directory path to watch or browse to select..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md font-calamity focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleBrowseClick}
              disabled={isFileDialogOpen}
              className="font-pkmnem font-bold bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {isFileDialogOpen ? 'Opening...' : 'Browse'}
            </button>
          </div>
        </div>
        
        {fileSelectionError && (
          <div className="p-3 bg-red-100 border border-red-300 rounded-md">
            <p className="font-calamity text-red-700">
              <span className="font-pkmnem font-bold">Error:</span> {fileSelectionError}
            </p>
          </div>
        )}
        
        <div className="flex space-x-2">
          <button
            type="submit"
            disabled={!selectedFileInfo?.isDirectory}
            className="font-pkmnem font-bold bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            Start Watching
          </button>
          
          {selectedFilePath && (
            <button
              type="button"
              onClick={handleClearSelection}
              className="font-pkmnem font-bold bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </form>
      
      {selectedFileInfo && (
        <div className="mt-4 p-3 bg-gray-100 rounded-md">
          <p className="font-calamity">
            <span className="font-pkmnem font-bold">Selected path:</span> {selectedFileInfo.path}
          </p>
          <p className="font-calamity">
            <span className="font-pkmnem font-bold">Type:</span> {selectedFileInfo.isDirectory ? 'Directory' : 'File'}
          </p>
          {selectedFileInfo.size && (
            <p className="font-calamity">
              <span className="font-pkmnem font-bold">Size:</span> {selectedFileInfo.size} bytes
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default WatchDir;
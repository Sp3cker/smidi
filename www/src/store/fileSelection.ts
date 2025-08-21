import { atom } from 'jotai';
import Neutralino from '@neutralinojs/lib';

// Types for file selection
export interface FileInfo {
  path: string;
  name: string;
  size?: number;
  isDirectory: boolean;
}

// Atoms for file selection state
export const selectedFilePathAtom = atom<string>('');
export const selectedFileInfoAtom = atom<FileInfo | null>(null);
export const isFileDialogOpenAtom = atom<boolean>(false);
export const fileSelectionErrorAtom = atom<string | null>(null);

// Derived atom for display name
export const displayNameAtom = atom((get) => {
  const fileInfo = get(selectedFileInfoAtom);
  return fileInfo ? fileInfo.name : 'No file selected';
});

// Actions for file selection
export const openFileDialogAtom = atom(
  null,
  async (get, set, options?: { title?: string; multiSelections?: boolean }) => {
    try {
      set(fileSelectionErrorAtom, null);
      set(isFileDialogOpenAtom, true);

      // Use Neutralino's showOpenDialog API with proper typing
      const result = await Neutralino.os.showOpenDialog(
        options?.title || 'Select a file or directory',
        {
          multiSelections: options?.multiSelections || false
        }
      );

      if (result && result.length > 0) {
        const selectedPath = result[0];
        set(selectedFilePathAtom, selectedPath);
        
        // Get file info using Neutralino's filesystem API
        try {
          const stats = await Neutralino.filesystem.getStats(selectedPath);
          const fileInfo: FileInfo = {
            path: selectedPath,
            name: selectedPath.split('/').pop() || selectedPath.split('\\').pop() || selectedPath,
            size: stats.size,
            isDirectory: stats.isDirectory
          };
          set(selectedFileInfoAtom, fileInfo);
        } catch (error) {
          console.error('Error getting file stats:', error);
          // Fallback to basic info
          const fileInfo: FileInfo = {
            path: selectedPath,
            name: selectedPath.split('/').pop() || selectedPath.split('\\').pop() || selectedPath,
            isDirectory: false
          };
          set(selectedFileInfoAtom, fileInfo);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      set(fileSelectionErrorAtom, errorMessage);
      console.error('File dialog error:', error);
    } finally {
      set(isFileDialogOpenAtom, false);
    }
  }
);

// Action to clear selection
export const clearFileSelectionAtom = atom(
  null,
  (get, set) => {
    set(selectedFilePathAtom, '');
    set(selectedFileInfoAtom, null);
    set(fileSelectionErrorAtom, null);
  }
);

// Action to select directory specifically
export const openDirectoryDialogAtom = atom(
  null,
  async (get, set, title?: string) => {
    try {
      set(fileSelectionErrorAtom, null);
      set(isFileDialogOpenAtom, true);

      const result = await Neutralino.os.showFolderDialog(
        title || 'Select a directory to watch'
      );

      if (result) {
        set(selectedFilePathAtom, result);
        
        const fileInfo: FileInfo = {
          path: result,
          name: result.split('/').pop() || result.split('\\').pop() || result,
          isDirectory: true
        };
        set(selectedFileInfoAtom, fileInfo);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      set(fileSelectionErrorAtom, errorMessage);
      console.error('Directory dialog error:', error);
    } finally {
      set(isFileDialogOpenAtom, false);
    }
  }
);

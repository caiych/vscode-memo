import vscode from 'vscode';
import fs from 'fs';
import path from 'path';

import {
  getWorkspaceCache,
  findUriByRef,
  ensureDirectoryExists,
  parseRef,
  getWorkspaceFolder,
  getMemoConfigProperty,
} from '../utils';

const openDocumentByReference = async ({
  reference,
  showOption = vscode.ViewColumn.Active,
}: {
  reference: string;
  showOption?: vscode.ViewColumn;
}) => {
  const { ref } = parseRef(reference);

  const uri = findUriByRef(getWorkspaceCache().allUris, ref);

  if (uri) {
    await vscode.commands.executeCommand('vscode.open', uri, showOption);
  } else {
    const workspaceFolder = getWorkspaceFolder()!;
    if (workspaceFolder) {
      const paths = ref.split('/');
      const refExt = path.parse(ref).ext;

      const resolvedRef = path.join(
        ...paths.slice(0, -1),
        `${paths.slice(-1)}${refExt !== '.md' && refExt !== '' ? '' : '.md'}`,
      );

      // Apply default folder rule if it's a short ref(i.e. doesn't have an existing dir in ref).
      const defaultPath =
        paths.length === 1
          ? getMemoConfigProperty('files.defaultPaths', []).find((rule) =>
              new RegExp(rule.rule).test(resolvedRef),
            )?.folder
          : undefined;

      const pathsWithExt = (defaultPath ? [defaultPath] : []).concat([resolvedRef]);
      const filePath = path.join(workspaceFolder, ...pathsWithExt);

      // don't override file content if it already exists
      if (!fs.existsSync(filePath)) {
        ensureDirectoryExists(filePath);
        fs.writeFileSync(filePath, '');
      }

      await vscode.commands.executeCommand('vscode.open', vscode.Uri.file(filePath), showOption);
    }
  }
};

export default openDocumentByReference;


'use client';

import React from 'react';

export const CodeBlock = ({ code }: { code: string }) => {
  return (
    <div className="bg-gray-900 text-white rounded-md">
      <div className="p-4 overflow-x-auto">
        <pre><code className="language-sql">{code}</code></pre>
      </div>
    </div>
  );
};

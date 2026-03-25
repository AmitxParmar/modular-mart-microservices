import React from 'react';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS';

interface PayloadProperty {
  name: string;
  type: string;
  required?: boolean;
  description: string;
}

interface ApiEndpointProps {
  id: string;
  title: string;
  method: HttpMethod;
  endpoint: string;
  description: React.ReactNode;
  headers?: { name: string; required: boolean; description: string }[];
  pathParams?: PayloadProperty[];
  bodyParams?: PayloadProperty[];
  queryParams?: PayloadProperty[];
  responseShape?: string;
}

const methodColors: Record<HttpMethod, string> = {
  GET: 'bg-green-100 text-green-800 border-green-200',
  POST: 'bg-blue-100 text-blue-800 border-blue-200',
  PUT: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  PATCH: 'bg-orange-100 text-orange-800 border-orange-200',
  DELETE: 'bg-red-100 text-red-800 border-red-200',
  OPTIONS: 'bg-gray-100 text-gray-800 border-gray-200',
};

export function ApiEndpoint({
  id,
  title,
  method,
  endpoint,
  description,
  headers,
  pathParams,
  bodyParams,
  queryParams,
  responseShape,
}: ApiEndpointProps) {
  return (
    <div id={id} className="pt-16 pb-12 border-b border-slate-200 last:border-0 scroll-mt-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-baseline gap-3">
        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
      </div>

      <div className="flex items-center gap-3 mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg overflow-x-auto">
        <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide border ${methodColors[method]}`}>
          {method}
        </span>
        <code className="text-sm font-mono text-slate-800 font-semibold">{endpoint}</code>
      </div>

      <div className="prose prose-slate prose-sm max-w-none mb-8">
        {description}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-8">
          {/* Headers */}
          {headers && headers.length > 0 && (
            <div>
              <h3 className="text-base font-semibold text-slate-900 mb-3">Headers</h3>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {headers.map((h) => (
                      <tr key={h.name}>
                        <td className="px-4 py-3 align-top">
                          <code className="text-xs font-mono text-pink-600 bg-pink-50 px-1 py-0.5 rounded mr-2">
                            {h.name}
                          </code>
                          {h.required && <span className="text-[10px] uppercase font-semibold text-red-600">Required</span>}
                        </td>
                        <td className="px-4 py-3 align-top text-slate-600">{h.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Properties Table abstracted */}
          {[
            { title: 'Path Parameters', data: pathParams },
            { title: 'Query Parameters', data: queryParams },
            { title: 'Body Parameters', data: bodyParams },
          ].map(({ title, data }) => {
            if (!data || data.length === 0) return null;
            return (
              <div key={title}>
                <h3 className="text-base font-semibold text-slate-900 mb-3">{title}</h3>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 font-medium">Property</th>
                        <th className="px-4 py-3 font-medium">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.map((p) => (
                        <tr key={p.name}>
                          <td className="px-4 py-3 align-top">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <code className="text-xs font-mono text-slate-900 font-semibold">{p.name}</code>
                                {p.required && <span className="text-[10px] uppercase font-semibold text-red-600">Req</span>}
                              </div>
                              <span className="text-[11px] font-mono text-slate-500">{p.type}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 align-top text-slate-600">{p.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>

        {/* Response */}
        <div>
          {responseShape && (
            <div className="sticky top-6">
              <h3 className="text-base font-semibold text-slate-900 mb-3">Response</h3>
              <div className="bg-slate-900 rounded-lg overflow-hidden">
                <div className="px-4 py-2 bg-slate-800 text-xs font-mono text-slate-400 border-b border-slate-700 flex justify-between">
                  <span>Example (200 OK)</span>
                  <span>application/json</span>
                </div>
                <div className="p-4 overflow-x-auto text-sm font-mono text-slate-200 leading-relaxed">
                  <pre>{responseShape}</pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

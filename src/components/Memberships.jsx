import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Memberships = ({ projects = [], onLeave }) => {
  return (
    <Card className="w-[calc(100%-2.5rem)] max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Memberships</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {projects.map((project) => (
            <div 
              key={project} 
              className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow dark:bg-neutral-800 dark:border-neutral-700"
            >
              <div className="flex flex-col">
                <h3 className="text-lg font-medium">{project}</h3>
              </div>
              <button 
                onClick={() => onLeave(project)}
                className="px-4 py-2 text-sm bg-asu-maroon hover:bg-opacity-90 text-white rounded-md transition-colors"
              >
                Leave Project
              </button>
            </div>
          ))}
          {projects.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              You are not a member of any projects
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default Memberships;
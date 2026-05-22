import React from 'react';
import { IconLayoutKanban, IconBarbell, IconChartBar, IconBook } from '@tabler/icons-react';

export default function BottomNav({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'tasks', label: 'Tasks', icon: IconLayoutKanban },
    { id: 'workouts', label: 'Workouts', icon: IconBarbell },
    { id: 'report', label: 'Progress', icon: IconChartBar },
    { id: 'journal', label: 'Journal', icon: IconBook },
  ];

  return (
    <div className="bottom-nav">
      <div className="content-wrapper" style={{ justifyContent: 'space-around', width: '100%' }}>
        {tabs.map(tab => {
          const IconComponent = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <div
              key={tab.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <IconComponent />
              <span>{tab.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

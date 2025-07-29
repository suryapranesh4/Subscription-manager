import React from 'react';
import CalendarView from './views/CalendarView';

const CalendarDemo = () => {
  // Mock user ID - replace with actual authenticated user ID
  const currentUserId = "user123";

  return (
    <div className="min-h-screen bg-gray-50">
      <CalendarView userId={currentUserId} />
    </div>
  );
};

export default CalendarDemo;

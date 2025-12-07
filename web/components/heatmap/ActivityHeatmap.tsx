'use client';

import React, { useEffect, useState } from 'react';

interface ActivityData {
  date: string;
  count: number;
}

interface ActivityHeatmapProps {
  userId: string;
}

export function ActivityHeatmap({ userId }: ActivityHeatmapProps) {
  const [activity, setActivity] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActivity() {
      try {
        const res = await fetch(`/api/activity?user_id=${userId}`);
        const data = await res.json();
        if (data.activity) {
          setActivity(data.activity);
        }
      } catch (err) {
        console.error('Failed to fetch activity:', err);
      }
      setLoading(false);
    }
    fetchActivity();
  }, [userId]);

  const activityMap = new Map<string, number>();
  for (const item of activity) {
    activityMap.set(item.date, item.count);
  }

  const today = new Date();
  const weeks: Date[][] = [];
  
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 364);
  const dayOfWeek = startDate.getDay();
  startDate.setDate(startDate.getDate() - dayOfWeek);

  let currentDate = new Date(startDate);
  while (currentDate <= today) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    weeks.push(week);
  }

  function getColorClass(count: number): string {
    if (count === 0) return 'bg-gray-100';
    if (count === 1) return 'bg-emerald-200';
    if (count === 2) return 'bg-emerald-300';
    if (count <= 4) return 'bg-emerald-400';
    return 'bg-emerald-500';
  }

  function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  const totalActivity = activity.reduce((sum, item) => sum + item.count, 0);
  const activeDays = activity.length;

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-24 bg-gray-100 rounded"></div>
      </div>
    );
  }

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthLabels: { month: string; index: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, weekIndex) => {
    const firstDayOfWeek = week[0];
    const month = firstDayOfWeek.getMonth();
    if (month !== lastMonth) {
      monthLabels.push({ month: months[month], index: weekIndex });
      lastMonth = month;
    }
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-600">
          {totalActivity} activities in the last year
        </h3>
        <span className="text-xs text-gray-400">{activeDays} active days</span>
      </div>
      
      <div className="overflow-x-auto pb-2">
        <div className="inline-block min-w-full">
          <div className="flex text-xs text-gray-400 mb-1" style={{ paddingLeft: '20px' }}>
            {monthLabels.map((label, i) => (
              <span
                key={i}
                style={{
                  position: 'relative',
                  left: `${label.index * 13}px`,
                  marginRight: i < monthLabels.length - 1 
                    ? `${(monthLabels[i + 1].index - label.index - 1) * 13}px` 
                    : '0'
                }}
              >
                {label.month}
              </span>
            ))}
          </div>

          <div className="flex gap-0.5">
            <div className="flex flex-col gap-0.5 text-xs text-gray-400 mr-1" style={{ fontSize: '9px' }}>
              <span className="h-3"></span>
              <span className="h-3 flex items-center">Mon</span>
              <span className="h-3"></span>
              <span className="h-3 flex items-center">Wed</span>
              <span className="h-3"></span>
              <span className="h-3 flex items-center">Fri</span>
              <span className="h-3"></span>
            </div>

            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-0.5">
                {week.map((day, dayIndex) => {
                  const dateStr = formatDate(day);
                  const count = activityMap.get(dateStr) || 0;
                  const isFuture = day > today;
                  
                  return (
                    <div
                      key={dayIndex}
                      className={`w-3 h-3 rounded-sm ${isFuture ? 'bg-transparent' : getColorClass(count)}`}
                      title={isFuture ? '' : `${dateStr}: ${count} activities`}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-1 mt-2 text-xs text-gray-400">
            <span>Less</span>
            <div className="w-3 h-3 rounded-sm bg-gray-100"></div>
            <div className="w-3 h-3 rounded-sm bg-emerald-200"></div>
            <div className="w-3 h-3 rounded-sm bg-emerald-300"></div>
            <div className="w-3 h-3 rounded-sm bg-emerald-400"></div>
            <div className="w-3 h-3 rounded-sm bg-emerald-500"></div>
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import Header from '../components/Header';
import ChatList from '../components/ChatList';
import ChatWindow from '../components/ChatWindow';

export default function Dashboard() {
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 border-r border-gray-200 bg-white">
          <ChatList />
        </div>

        {/* Main Chat Area */}
        <div className="flex-1">
          <ChatWindow />
        </div>
      </div>
    </div>
  );
}

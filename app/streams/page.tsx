import React from "react";

const StreamsPage: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-center">
      <h1 className="text-3xl font-bold mb-4">🎥 Streams</h1>
      <p className="text-lg text-gray-700 mb-2">
        Get ready — streaming features are on the way!
      </p>
      <div className="bg-gray-100 rounded-2xl p-6 mt-6 shadow-sm">
        <p className="text-base text-gray-800">
          We’re working behind the scenes to bring you a powerful and smooth streaming experience.
        </p>
        <p className="mt-4 text-xl font-semibold text-gray-900">
          Launching in <span className="text-blue-600">May 2025</span> 🚀
        </p>
      </div>
      <p className="mt-6 text-sm text-gray-500">
        Stay tuned for updates and early access opportunities.
      </p>
    </div>
  );
};

export default StreamsPage;

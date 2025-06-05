
interface DashboardHeaderProps {
  userData: any;
}

const DashboardHeader = ({ userData }: DashboardHeaderProps) => {
  return (
    <div className="bg-white/80 backdrop-blur-lg border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Good morning, {userData?.name || 'Sarah'}!
            </h1>
            <p className="text-gray-600 mt-2 text-lg">Ready to find your dream home?</p>
          </div>
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-white font-semibold text-xl">
              {userData?.name?.charAt(0) || 'S'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;

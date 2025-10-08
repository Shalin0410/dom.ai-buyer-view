
interface DashboardHeaderProps {
  userData: any;
}

const DashboardHeader = ({ userData }: DashboardHeaderProps) => {
  return (
    <div className="bg-white/80 backdrop-blur-lg border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {userData?.name || 'Sarah'}
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Here's what's happening with your home search</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;

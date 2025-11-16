export default function InfoLoader({ text }) {
  return (
    <div className="py-12 flex flex-col items-center justify-center">
      <div className="flex space-x-2">
        <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
        <div
          className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"
          style={{ animationDelay: "0.2s" }}
        ></div>
        <div
          className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"
          style={{ animationDelay: "0.4s" }}
        ></div>
      </div>
      <p className="mt-4 text-gray-600 font-medium">{text}</p>
    </div>
  );
}

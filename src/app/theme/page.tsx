export default function ThemePage() {
  const colors = {
    primary: {
      name: "Professional Blue",
      value: "#3B6AC7",
      description: "Primary brand color - clean, trustworthy, professional"
    },
    secondary: {
      name: "Business Green", 
      value: "#3EA65C",
      description: "Success, growth, productivity"
    },
    accent: {
      name: "Professional Amber",
      value: "#E69B28", 
      description: "Attention, insights, intelligence"
    },
    neutral: {
      name: "Clean Gray",
      value: "#F8F9FA",
      description: "Background, subtle elements"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Filyx.ai Theme Colors
          </h1>
          
          <div className="grid md:grid-cols-2 gap-8">
            {Object.entries(colors).map(([key, color]) => (
              <div key={key} className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center mb-4">
                  <div 
                    className="w-16 h-16 rounded-lg mr-4 border-2 border-gray-200"
                    style={{ backgroundColor: color.value }}
                  ></div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {color.name}
                    </h3>
                    <p className="text-lg font-mono text-gray-600">
                      {color.value}
                    </p>
                  </div>
                </div>
                <p className="text-gray-600">
                  {color.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Color Usage Examples
            </h2>
            
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                  Primary Button
                </button>
                <button className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors">
                  Success Action
                </button>
                <button className="bg-amber-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-amber-600 transition-colors">
                  Warning/Alert
                </button>
              </div>
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-blue-900 font-semibold mb-2">Information Panel</h3>
                <p className="text-blue-700">
                  Using Professional Blue for informational content and highlights
                </p>
              </div>
              
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="text-green-900 font-semibold mb-2">Success Panel</h3>
                <p className="text-green-700">
                  Using Business Green for success states and positive actions
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <a 
              href="/" 
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
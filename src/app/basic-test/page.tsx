export default function BasicTest() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Basic Test Page</h1>
      <p>If you can see this, the page is loading correctly.</p>
      <p>Current time: {new Date().toLocaleString()}</p>
    </div>
  )
}
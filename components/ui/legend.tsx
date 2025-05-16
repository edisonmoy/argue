import { Card, CardContent } from "@/components/ui/card"

export function Legend() {
  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <h3 className="font-medium mb-2">Legend</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-100 border-2 border-green-500 rounded mr-2"></div>
            <span>Axiom</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-100 border-2 border-yellow-500 rounded mr-2"></div>
            <span>Assumption</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-100 border-2 border-blue-500 rounded mr-2"></div>
            <span>Intermediate</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-purple-100 border-2 border-purple-500 rounded mr-2"></div>
            <span>Conclusion</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

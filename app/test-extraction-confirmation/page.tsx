import { ExtractionConfirmationDemo } from "@/components/extraction-confirmation-demo";

export default function TestExtractionConfirmationPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Extraction Confirmation Dialog Test
          </h1>
          <p className="text-gray-600">
            Test the extraction confirmation dialog functionality
          </p>
        </div>
        
        <ExtractionConfirmationDemo />
      </div>
    </div>
  );
}
import { InstructorDashboard } from "@/components/instructor-dashboard"

export default function InstructorPage() {
  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-gradient-to-b from-background to-muted/30 p-6">
      <div className="mx-auto max-w-3xl">
        <InstructorDashboard />
      </div>
    </main>
  )
}

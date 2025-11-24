"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/AuthProvider"   // ✅ IMPORT AUTH

export default function CreateJobPage() {
  const router = useRouter()
  const { userID } = useAuth()   // ✅ GET LOGGED-IN USER ID (companyId)
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    skills: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const companyId = Number(userID)   // ✅ COMPANY ID FROM AUTH

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      console.log(userID,"new")
      const response = await fetch(
        "https://3o9qkf05xf.execute-api.us-east-2.amazonaws.com/v1/create_job",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            body: JSON.stringify({
              companyId,   // ✅ DYNAMIC USER ID
              jobName: formData.title,
              jobStatus: "Open",
              description: formData.description,
              skills: formData.skills.split(",").map((s) => s.trim())
            }),
          }),
        }
      )

      const result = await response.json()
      const parsedResult = JSON.parse(result.body)

      if (response.ok) {
        console.log("Job created successfully:", parsedResult)
        router.push("/jobs")
      } else {
        console.error("Failed to create job:", parsedResult)
        alert(parsedResult.error || "Failed to create job")
      }
    } catch (error) {
      console.error("Error creating job:", error)
      alert("Error creating job")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-50 px-6">
      <div className="bg-white p-10 rounded-xl shadow-lg w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-blue-700 mb-6 text-center">Create New Job</h1>

        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
            <label className="block text-gray-700 font-semibold mb-1">Job Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="border border-gray-300 rounded-lg w-full px-4 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              className="border border-gray-300 rounded-lg w-full px-4 py-2 h-24 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-1">Required Skills (comma separated)</label>
            <input
              type="text"
              name="skills"
              value={formData.skills}
              onChange={handleChange}
              required
              className="border border-gray-300 rounded-lg w-full px-4 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition ${
              isSubmitting && "opacity-70 cursor-not-allowed"
            }`}
          >
            {isSubmitting ? "Creating..." : "Create Job"}
          </button>
        </form>
      </div>
    </div>
  )
}

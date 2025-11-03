export default function SkillCard({ skill }) {
  return (
    <div style={{
      border: '1px solid #ccc',
      padding: '12px',
      borderRadius: '6px',
      boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
    }}>
      {skill}
    </div>
  )
}

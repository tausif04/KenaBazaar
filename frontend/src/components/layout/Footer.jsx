export default function Footer() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-8 text-sm text-muted">
        © {new Date().getFullYear()} KenaBazaar
      </div>
    </footer>
  )
}

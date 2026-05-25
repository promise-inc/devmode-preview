export default function HomePage() {
  return (
    <main style={{ padding: 40, fontFamily: 'system-ui' }}>
      <h1>DevMode Preview Demo</h1>
      <p>Click the floating button at the bottom-right corner to open the dev companion.</p>
      <ul>
        <li>
          <a href="/dashboard">Dashboard (private route)</a>
        </li>
        <li>
          <a href="/pricing">Pricing</a>
        </li>
      </ul>
    </main>
  );
}

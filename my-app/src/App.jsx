import { Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import About from './pages/About'

function App() {
  const handleNotificationTest = () => {
    if (typeof window.requestNotificationPermission === 'function') {
      window.requestNotificationPermission()
    } else {
      console.warn('通知関数がまだ準備されていません')
    }
  }

  return (
    <div>
      <nav>
        <Link to="/">ホーム</Link> | <Link to="/about">アバウト</Link>
      </nav>

      {/* 通知テストボタン */}
      <div style={{ margin: '20px 0' }}>
        <button onClick={handleNotificationTest}>
          通知をテスト
        </button>
      </div>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </div>
  )
}

export default App


import { render, screen } from '@testing-library/react'
import App from './App'

test('renders user frontend text', () => {
  render(<App />)
  const linkElement = screen.getByText(/User Frontend/i)
  expect(linkElement).toBeInTheDocument()
})

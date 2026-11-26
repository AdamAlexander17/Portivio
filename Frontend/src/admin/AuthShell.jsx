import { PRODUCT_NAME } from '../brand'
import { BLANK_TOKENS } from '../theme'
import { ThemePreview } from './Themes'

// Three looks to show off on the sign-in screens (the same shape as themes in the database).
const SHOWCASE = [
  { ...BLANK_TOKENS, scheme: 'dark', shape: 'soft', heading_font: 'space-grotesk', body_font: 'inter',
    colors: { bg: '#12131c', surface: '#1b1d29', text: '#f2f3f7', accent: '#8b7dff', on_accent: '#ffffff', tint: '#171925', dark: '#0a0b11' } },
  { ...BLANK_TOKENS, shape: 'sharp', heading_font: 'playfair', body_font: 'inter',
    colors: { bg: '#f4efe6', surface: '#fbf8f2', text: '#2a241b', accent: '#7a6a4f', on_accent: '#ffffff', tint: '#e9e0d0', dark: '#2a241b' } },
  { ...BLANK_TOKENS, heading_font: 'manrope', body_font: 'inter',
    colors: { bg: '#ffffff', surface: '#ffffff', text: '#14141f', accent: '#14141f', on_accent: '#ffffff', tint: '#f1f1f4', dark: '#14141f' } },
]

// The frame around sign in, sign up and the password screens:
// the form on the left, a short pitch with sample looks on the right.
export default function AuthShell({ children }) {
  return (
    <div className="adm-login auth">
      <div className="auth__form">
        <span className="auth__brand">
          <span className="adm-side__mark" aria-hidden="true">
            {PRODUCT_NAME.charAt(0)}
          </span>
          {PRODUCT_NAME}
        </span>
        {children}
      </div>

      <aside className="auth__side" aria-hidden="true">
        <p className="auth__headline">
          Fill once.
          <br />
          Switch themes anytime.
        </p>
        <p className="auth__pitch">
          Your info, projects and experience power every theme. Change the look in one click and your content stays put.
        </p>
        <div className="auth__cards">
          {SHOWCASE.map((tokens, index) => (
            <ThemePreview key={index} tokens={tokens} name="Ayesha Khan" />
          ))}
        </div>
      </aside>
    </div>
  )
}

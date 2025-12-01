import Link from 'next/link';
import {
  LoginLink,
  LogoutLink,
} from '@kinde-oss/kinde-auth-nextjs/components';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { ThemeToggle } from './ThemeToggle';
import { LogoLink } from './LogoLink';

type Theme = 'light' | 'dark';

type HeaderProps = {
  initialTheme: Theme;
};

export async function Header({ initialTheme }: HeaderProps) {
  const { isAuthenticated } = getKindeServerSession();
  const authed = await isAuthenticated();

  // base styles shared by all header buttons
  const baseBtn =
    'inline-flex items-center justify-center rounded-full border select-none cursor-pointer whitespace-nowrap';

  const textBtn =
    baseBtn + ' h-9 px-4 text-xs sm:text-sm'; // Add post / Log in / Log out
  const iconBtn =
    baseBtn + ' h-9 w-9 text-xs sm:text-sm p-0'; // profile icon only

  return (
    <header className="border-b dark:border-b-[0.1px] dark:border-b-[#475569] bg-[#fafcff] dark:bg-slate-800 backdrop-blur sticky top-0 z-20 overflow-hidden">
      <div
        className="
          max-w-4xl mx-auto
          flex flex-wrap items-center gap-2
          px-2 py-2
          sm:flex-nowrap sm:justify-between sm:px-4 sm:py-3
        "
      >
        <LogoLink />

        <nav className="ml-auto flex flex-wrap items-center gap-2">
          <Link
            href="/posts/new"
            draggable={false}
            className={!authed ? 'pointer-events-none opacity-50' : ''}
          >
            <button className={textBtn} draggable={false}>
              Add post
            </button>
          </Link>

          {authed && (
            <Link href="/profile" draggable={false}>
              <button className={iconBtn} draggable={false}>
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="w-5 h-5 text-slate-600 dark:text-slate-200"
                  stroke="currentColor"
                  fill="none"
                  strokeWidth="2.4"
                >
                  <circle cx="12" cy="8" r="3.2" />
                  <path d="M5 19c1.7-3.2 3.7-4.8 7-4.8s5.3 1.6 7 4.8" />
                </svg>
              </button>
            </Link>
          )}

          {authed ? (
            <LogoutLink draggable={false}>
              <button className={textBtn} draggable={false}>
                Log out
              </button>
            </LogoutLink>
          ) : (
            <LoginLink draggable={false}>
              <button className={textBtn} draggable={false}>
                Log in
              </button>
            </LoginLink>
          )}

          <ThemeToggle initialTheme={initialTheme} />
        </nav>
      </div>
    </header>
  );
}

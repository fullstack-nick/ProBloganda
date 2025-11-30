// components/layout/LogoLink.tsx
'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';

export function LogoLink() {
  const router = useRouter();

  function handleClick() {
    router.push('/posts');
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="
        inline-flex items-center justify-center
        h-9 md:h-auto
        p-0 border-0 bg-transparent
        select-none cursor-pointer shrink-0
      "
    >
      {/* smaller box on mobile, original size from md up */}
      <div className="relative h-5 w-20 md:h-10 md:w-40 max-[360px]:h-3 max-[360px]:w-12">
        <Image
          src="/logo.png"
          alt="Pro Bloganda logo"
          fill
          sizes="(max-width: 360px) 48px, (max-width: 768px) 80px, 160px"
          draggable={false}
          className="
            object-contain transform
            scale-500
            md:scale-350
            max-[360px]:scale-[6.5]
            invert dark:invert-0
          "
          priority
        />
      </div>
    </button>
  );
}

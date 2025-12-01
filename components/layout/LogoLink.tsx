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
        p-0 border-0 bg-transparent
        select-none cursor-pointer
        shrink-0
      "
    >
      <div
        className="
          relative shrink-0
          h-1.5 w-6
          -mr-25
          -mt-4
          md:h-2 md:w-8
          md:-mt-5
          max-[360px]:h-1 max-[360px]:w-4
          max-[360px]:-mb-1.5
          transition-none
        "
      >
        <Image
          src="/logo.png"
          alt="Pro Bloganda logo"
          width={1024}
          height={1024}
          sizes="(max-width: 360px) 48px, (max-width: 768px) 80px, 160px"
          draggable={false}
          className="
            object-contain
            transform
            scale-500
            md:scale-350
            max-[360px]:scale-[6.5]
            invert dark:invert-0
            transition-none
          "
          priority
        />
      </div>
    </button>
  );
}
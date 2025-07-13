import Image from "next/image";
import { Button } from "@/components/ui/button";


export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen px-4 py-8 lg:px-8 sm:p-20 font-[family-name:var(--font-geist-sans)] mt-60">
      <section className="w-full max-w-7xl mx-auto">
        <div className="relative bg-white dark:bg-background rounded-3xl overflow-hidden min-h-[600px] flex items-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,0,0,0.02),transparent_50%)] dark:bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.02),transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(0,0,0,0.01),transparent_50%)] dark:bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.01),transparent_50%)]"></div>

          <div className="relative z-10 container mx-auto px-8 lg:px-16">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div id="main" className="space-y-8">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
                  <span className="text-black dark:text-white text-sm font-medium tracking-wide uppercase">
                    Online Exclusive
                  </span>
                </div>

                <div className="space-y-6">
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black dark:text-white leading-tight">
                    Excellence in Every Brew
                  </h1>

                  <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed max-w-lg">
                    Discover our carefully curated selection of premium coffee beans, sourced from the finest farms and
                    roasted to perfection for an exceptional brewing experience.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    size="lg"
                    className="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black font-semibold px-8 py-6 rounded-full text-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
                  >
                    View Collection
                    <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    className="border-gray-300 dark:border-gray-600 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 px-8 py-6 rounded-full text-lg transition-all duration-300 bg-transparent"
                  >
                    Learn More
                  </Button>
                </div>
              </div>

              <div className="relative flex justify-center lg:justify-end">
                <div className="relative">
                    <div className="relative w-96 h-80 rounded-2xl overflow-hidden bg-gray-50 dark:bg-gray-800 shadow-2xl">
                    <Image
                      src="/HS-1.png"
                      alt="Premium Coffee Products"
                      width={384}
                      height={320}
                      className="w-full h-full object-cover"
                      priority
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    </div>

                  <div className="absolute -top-4 -left-4 w-8 h-8 bg-black dark:bg-white rounded-full opacity-20 animate-pulse"></div>
                  <div className="absolute top-8 -right-8 w-6 h-6 bg-black dark:bg-white rounded-full opacity-15 animate-pulse delay-300"></div>
                  <div className="absolute -bottom-8 left-8 w-7 h-7 bg-black dark:bg-white rounded-full opacity-25 animate-pulse delay-700"></div>
                  <div className="absolute bottom-4 -right-12 w-5 h-5 bg-black dark:bg-white rounded-full opacity-20 animate-pulse delay-1000"></div>

                  <div className="absolute -inset-4 border border-gray-200 dark:border-gray-700 rounded-3xl opacity-30"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image aria-hidden src="/file.svg" alt="File icon" width={16} height={16} />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image aria-hidden src="/window.svg" alt="Window icon" width={16} height={16} />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image aria-hidden src="/globe.svg" alt="Globe icon" width={16} height={16} />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}

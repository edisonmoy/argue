import { ArgumentAnalyzer } from "@/components/argument-analyzer";

export default function Home() {
    return (
        <main className="flex flex-col h-screen">
            <header className="border-b p-4">
                <h1 className="text-2xl font-bold text-center">
                    Argument Explorer
                </h1>
            </header>
            <ArgumentAnalyzer />
        </main>
    );
}


import SpinnerMini from "@/app/_components/SpinnerMini";

export default function Loading() {
    return (
        <div className="grid  justify-items-center gap-2">
            <SpinnerMini />
            <p className="text-xl text-primary-200">Loading cabin data...</p>
        </div>
    );
}

import SpinnerMini from "@/app/_components/SpinnerMini";

export default function Loading() {
    return (
        <div className="grid items-center justify-center">
            <SpinnerMini />
            <p className="text-xl text-primary-200">Londing cabin data...</p>
        </div>
    );
}
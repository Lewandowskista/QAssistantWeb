import * as React from "react"
import { cn } from "@/lib/utils"

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> { }

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
    ({ className, defaultChecked, checked, onChange, ...props }, ref) => {
        return (
            <label className={cn("relative inline-flex items-center cursor-pointer", className)}>
                <input
                    type="checkbox"
                    className="sr-only peer"
                    ref={ref}
                    checked={checked}
                    defaultChecked={defaultChecked}
                    onChange={onChange}
                    {...props}
                />
                <div className="w-11 h-6 bg-surface-hover peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
            </label>
        )
    }
)
Switch.displayName = "Switch"

export { Switch }

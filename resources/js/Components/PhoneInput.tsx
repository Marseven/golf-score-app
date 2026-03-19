import { PhoneInput as ReactPhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';

interface PhoneInputProps {
    value: string;
    onChange: (value: string) => void;
    error?: string;
    label?: string;
}

export default function PhoneInput({ value, onChange, error, label }: PhoneInputProps) {
    return (
        <div>
            {label && (
                <label className="block text-sm font-medium text-foreground mb-1.5">
                    {label}
                </label>
            )}
            <ReactPhoneInput
                defaultCountry="ga"
                value={value}
                onChange={onChange}
                inputClassName="phone-input-field"
                countrySelectorStyleProps={{
                    buttonClassName: 'phone-country-btn',
                }}
                className="phone-input-container"
            />
            {error && <p className="mt-1.5 text-sm text-destructive">{error}</p>}
        </div>
    );
}

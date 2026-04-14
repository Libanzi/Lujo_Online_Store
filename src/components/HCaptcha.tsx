import { useRef, forwardRef, useImperativeHandle } from "react";
import HCaptcha from "@hcaptcha/react-hcaptcha";

const HCAPTCHA_SITE_KEY = import.meta.env.VITE_HCAPTCHA_SITE_KEY || "";

export interface HCaptchaHandle {
  execute: () => void;
  resetCaptcha: () => void;
}

interface HCaptchaComponentProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
}

export const HCaptchaComponent = forwardRef<HCaptchaHandle, HCaptchaComponentProps>(
  ({ onVerify, onError, onExpire }, ref) => {
    const captchaRef = useRef<HCaptcha>(null);

    useImperativeHandle(ref, () => ({
      execute: () => {
        captchaRef.current?.execute();
      },
      resetCaptcha: () => {
        captchaRef.current?.resetCaptcha();
      },
    }));

    return (
      <HCaptcha
        ref={captchaRef}
        sitekey={HCAPTCHA_SITE_KEY}
        onVerify={onVerify}
        onError={onError}
        onExpire={onExpire}
        size="invisible"
      />
    );
  }
);

HCaptchaComponent.displayName = "HCaptchaComponent";

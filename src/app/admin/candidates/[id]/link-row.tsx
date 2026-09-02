"use client";

import { ExternalLinkIcon, QrCodeIcon } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import type { Link } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { LINK_LABEL } from "@/lib/links";

export function LinkRow({ link }: { link: Link }) {
  const [qr, setQr] = useState(false);
  return (
    <li className="space-y-2">
      <div className="flex items-center gap-2 text-sm">
        <span className="w-24 shrink-0 text-xs text-muted-foreground">{LINK_LABEL[link.type]}</span>
        <a
          href={link.url}
          target="_blank"
          rel="noreferrer"
          className="flex min-w-0 items-center gap-1 truncate text-primary underline-offset-4 hover:underline"
        >
          <span className="truncate">{link.url}</span>
          <ExternalLinkIcon className="size-3 shrink-0" />
        </a>
        {link.type === "expo" && (
          <Button variant="ghost" size="icon-xs" aria-label="Show QR code" onClick={() => setQr(!qr)}>
            <QrCodeIcon />
          </Button>
        )}
      </div>
      {qr && (
        <div className="ml-26 inline-block rounded-lg border bg-white p-3">
          <QRCodeSVG value={link.url} size={160} />
        </div>
      )}
    </li>
  );
}

import { useTheme, THEME_PRESETS, ThemeType } from "@/contexts/ThemeContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Palette } from "lucide-react";

export default function ThemeSettings() {
  const { currentTheme, primaryColor, setTheme, setCustomColor } = useTheme();

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette size={20} style={{ color: primaryColor }} />
          Apparence et Thème
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Preset themes */}
        <div>
          <p className="text-sm font-medium text-slate-700 mb-3">Thèmes prédéfinis</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {(Object.entries(THEME_PRESETS) as [ThemeType, typeof THEME_PRESETS[ThemeType]][])
              .filter(([k]) => k !== "custom")
              .map(([key, preset]) => (
              <button key={key} onClick={() => setTheme(key)}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                  currentTheme === key ? "shadow-md" : "border-slate-200 hover:border-slate-300"
                }`}
                style={currentTheme === key ? { borderColor: preset.primary, backgroundColor: preset.primary + "10" } : {}}>
                <div className="w-8 h-8 rounded-full flex-shrink-0 border-2 border-white shadow"
                  style={{ backgroundColor: preset.primary }} />
                <span className="text-sm font-medium text-slate-700">{preset.label}</span>
                {currentTheme === key && <span className="ml-auto text-xs font-bold text-green-600">✓</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Custom color */}
        <div>
          <p className="text-sm font-medium text-slate-700 mb-3">Couleur personnalisée</p>
          <div className="flex items-center gap-4">
            <input type="color" value={primaryColor}
              onChange={e => setCustomColor(e.target.value)}
              className="w-12 h-12 rounded-lg cursor-pointer border border-slate-200" />
            <div>
              <p className="text-sm text-slate-600">Couleur actuelle</p>
              <p className="font-mono text-sm font-bold" style={{ color: primaryColor }}>
                {primaryColor.toUpperCase()}
              </p>
            </div>
            <div className="flex-1 h-10 rounded-lg" style={{ backgroundColor: primaryColor, opacity: 0.2 }} />
          </div>
        </div>

        {/* Preview */}
        <div>
          <p className="text-sm font-medium text-slate-700 mb-3">Aperçu</p>
          <div className="rounded-lg overflow-hidden border border-slate-200">
            {/* Mini sidebar preview */}
            <div className="flex h-20">
              <div className="w-24 flex flex-col p-2 gap-1" style={{ backgroundColor: primaryColor }}>
                <div className="h-3 rounded bg-white/30" />
                <div className="h-2 rounded bg-white/50 w-16" />
                <div className="h-2 rounded bg-white/20 w-12" />
              </div>
              <div className="flex-1 bg-slate-50 p-3 flex flex-col gap-2">
                <div className="h-3 rounded bg-slate-200 w-24" />
                <div className="flex gap-2">
                  <div className="h-8 w-20 rounded text-xs font-semibold flex items-center justify-center text-white"
                    style={{ backgroundColor: primaryColor }}>Bouton</div>
                  <div className="h-8 w-20 rounded border border-slate-200 text-xs flex items-center justify-center text-slate-600">Annuler</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-400">
          ✓ Le thème s'applique au menu latéral, à la page de connexion et aux boutons principaux.
          Sauvegardé automatiquement.
        </p>
      </CardContent>
    </Card>
  );
}

package cl.duoc.catalogo.util;

import java.text.Normalizer;
import java.util.Locale;

public final class Texto {

    private Texto() {
    }

    /** Minúsculas y sin tildes, para que "antirrabica" encuentre "antirrábica". */
    public static String normalizar(String s) {
        if (s == null) {
            return "";
        }
        return Normalizer.normalize(s, Normalizer.Form.NFD).replaceAll("\\p{M}", "").toLowerCase(Locale.ROOT).trim();
    }
}

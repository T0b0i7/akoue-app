"""
Prototype Python — détecteur de visage Akouè (touche personnelle).

Logique miroir du Face Unlock natif de l'app :
1re ouverture -> demande permission caméra -> capture visage -> vérifie présence
-> enrôle (sauvegarde embedding / photo) -> prochaines ouvertures = comparaison.

Usage :
  pip install opencv-python
  python scripts/face-detector-prototype.py

Sur mobile (APK) c'est expo-local-authentication + expo-camera qui fait le job ;
ce script sert à tester la logique sur desktop.
"""
import sys

def main() -> int:
    try:
        import cv2
    except ImportError:
        print("Installe d'abord : pip install opencv-python")
        return 1

    cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    face_cascade = cv2.CascadeClassifier(cascade_path)
    if face_cascade.empty():
        print("Cascade introuvable :", cascade_path)
        return 1

    # 1) Permission caméra : sur desktop = accord explicite avant d'ouvrir le flux
    ans = input("Akouè veut accéder à ta caméra pour capturer ton visage (o/n) ? ").strip().lower()
    if ans not in ("o", "oui", "y", "yes"):
        print("Permission refusée — Face Unlock non activé (comme 'Plus tard' dans l'app).")
        return 0

    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Caméra inaccessible.")
        return 1

    print("Montre ton visage… (q pour quitter, v pour valider l'enrôlement)")
    enrolled = False
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.2, 5, minSize=(80, 80))
        for (x, y, w, h) in faces:
            cv2.rectangle(frame, (x, y), (x + w, y + h), (122, 77, 255), 2)
        cv2.putText(frame, f"visages: {len(faces)}", (12, 28),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
        cv2.imshow("Akoue - Face Unlock prototype (v=valider, q=quitter)", frame)
        key = cv2.waitKey(30) & 0xFF
        if key in (ord("v"), ord("V")):
            if len(faces) == 1:
                cv2.imwrite("face_enrolled.png", frame)
                print("Visage enrôlé -> face_enrolled.png (mot de passe visage OK).")
                enrolled = True
            else:
                print(f"Enrôlement refusé : {len(faces)} visage(s), il en faut exactement 1.")
            break
        if key in (ord("q"), ord("Q"), 27):
            break

    cap.release()
    cv2.destroyAllWindows()
    if not enrolled:
        print("Aucun enrôlement — réessaie avec un bon éclairage.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

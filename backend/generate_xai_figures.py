#!/usr/bin/env python3
"""
Generate SHAP / LIME figures for thesis and paper.

Uses the same inference + XAI path as predict_disease.py (production pipeline).

Usage:
    python generate_xai_figures.py
    python generate_xai_figures.py --text "itching, skin_rash, nodal_skin_eruptions"
    python generate_xai_figures.py --output ../documentations/figures

Requires a trained model in backend/symptom_disease_model/ (after Colab or train_model.py).
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np

SCRIPT_DIR = Path(__file__).resolve().parent
ROOT_DIR = SCRIPT_DIR.parent

# Import production predictor (SHAP + LIME logic)
sys.path.insert(0, str(SCRIPT_DIR))
from predict_disease import DiseasePredictor  # noqa: E402

DEFAULT_SAMPLES = [
    {
        "name": "fungal_infection",
        "text": "itching, skin_rash, nodal_skin_eruptions, dischromic _patches",
        "title": "Fungal infection case",
    },
    {
        "name": "malaria",
        "text": "high_fever, chills, vomiting, headache, sweating",
        "title": "Malaria case",
    },
    {
        "name": "diabetes",
        "text": "polyuria, polydipsia, weight_loss, fatigue, blurred_and_distorted_vision",
        "title": "Diabetes case",
    },
]

POS_COLOR = "#22a84a"
NEG_COLOR = "#64748b"
MERGED_COLOR = "#1d9340"


def _barh_importance(ax, items: list[dict], xlabel: str, title: str, value_key: str = "importance"):
    """Horizontal bar chart for word-level scores."""
    if not items:
        ax.text(0.5, 0.5, "No features to display", ha="center", va="center", transform=ax.transAxes)
        ax.set_title(title)
        return

    pairs = [(it["word"], float(it.get(value_key, it.get("weight", 0)))) for it in items]
    pairs.sort(key=lambda x: x[1])
    names, vals = zip(*pairs)
    colors = [POS_COLOR if v > 0 else NEG_COLOR for v in vals]

    ax.barh(names, vals, color=colors, edgecolor="white", linewidth=0.5)
    ax.axvline(0, color="#94a3b8", linewidth=0.8)
    ax.set_xlabel(xlabel)
    ax.set_title(title, fontsize=11, fontweight="600")
    ax.tick_params(axis="both", labelsize=9)


def generate_figures_for_sample(
    predictor: DiseasePredictor,
    sample_text: str,
    sample_name: str,
    sample_title: str,
    output_dir: Path,
) -> dict:
    result = predictor.predict(sample_text, None)
    if not result.get("success"):
        raise RuntimeError(result.get("message", "Prediction failed"))

    predicted = result["predicted_disease"]
    confidence = result["confidence"]

    shap_result = predictor._compute_shap(result["normalised_input"], predicted)
    lime_result = predictor._compute_lime(result["normalised_input"], predicted)
    merged = predictor._merge_explanations(shap_result["word_importance"], lime_result)

    shap_items = shap_result["word_importance"][:12]
    lime_items = (lime_result.get("features") or [])[:12]
    merged_items = merged[:12]

    meta = {
        "sample": sample_name,
        "input": result["normalised_input"],
        "predicted_disease": predicted,
        "confidence": confidence,
        "top3": result.get("top_predictions", []),
    }

    prefix = output_dir / f"fig_{sample_name}"

    # --- SHAP only ---
    fig, ax = plt.subplots(figsize=(10, 5.5))
    _barh_importance(
        ax,
        shap_items,
        "SHAP attribution (toward predicted class)",
        f"SHAP — {sample_title}\nPredicted: {predicted} ({confidence:.1%})",
    )
    fig.tight_layout()
    shap_path = Path(f"{prefix}_shap.png")
    fig.savefig(shap_path, dpi=200, bbox_inches="tight")
    plt.close(fig)

    # --- LIME only ---
    fig, ax = plt.subplots(figsize=(10, 5.5))
    lime_plot_items = [{"word": f["word"], "importance": f["weight"]} for f in lime_items]
    _barh_importance(
        ax,
        lime_plot_items,
        "LIME local weight (predicted class)",
        f"LIME — {sample_title}\nPredicted: {predicted} ({confidence:.1%})",
    )
    fig.tight_layout()
    lime_path = Path(f"{prefix}_lime.png")
    fig.savefig(lime_path, dpi=200, bbox_inches="tight")
    plt.close(fig)

    # --- Combined panel (thesis-friendly) ---
    fig, axes = plt.subplots(1, 3, figsize=(16, 5.5))
    _barh_importance(
        axes[0],
        shap_items,
        "SHAP score",
        "SHAP",
    )
    _barh_importance(
        axes[1],
        lime_plot_items,
        "LIME weight",
        "LIME",
    )
    _barh_importance(
        axes[2],
        merged_items,
        "Unified score",
        "SHAP + LIME (merged)",
    )
    fig.suptitle(
        f"{sample_title} — {predicted} ({confidence:.1%})\nInput: {result['normalised_input']}",
        fontsize=12,
        fontweight="600",
        y=1.02,
    )
    fig.tight_layout()
    combined_path = Path(f"{prefix}_shap_lime_combined.png")
    fig.savefig(combined_path, dpi=200, bbox_inches="tight")
    plt.close(fig)

    meta["figures"] = {
        "shap": str(shap_path),
        "lime": str(lime_path),
        "combined": str(combined_path),
    }
    return meta


def main():
    parser = argparse.ArgumentParser(description="Export SHAP/LIME figures for thesis/paper")
    parser.add_argument("--model", default=str(SCRIPT_DIR / "symptom_disease_model"))
    parser.add_argument("--vocab", default=str(SCRIPT_DIR / "symptom_vocabulary.json"))
    parser.add_argument("--precautions", default=str(ROOT_DIR / "Disease precaution.csv"))
    parser.add_argument("--output", default=str(ROOT_DIR / "documentations" / "figures"))
    parser.add_argument("--text", help="Single custom sample text (skips default batch)")
    parser.add_argument("--name", default="custom", help="Filename prefix for --text sample")
    args = parser.parse_args()

    model_path = Path(args.model)
    if not (model_path / "config.json").exists():
        print("ERROR: Model not found. Train on Colab first, then copy to backend/symptom_disease_model/")
        sys.exit(1)

    # Check for weight files
    weight_files = list(model_path.glob("*.safetensors")) + list(model_path.glob("pytorch_model*.bin"))
    if not weight_files:
        print("ERROR: Model folder exists but has no weights (.safetensors / pytorch_model.bin).")
        print("       Complete training on Colab and copy the full symptom_disease_model/ folder.")
        sys.exit(1)

    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    print("Loading model (SHAP + LIME initialisation may take 1–2 min)...")
    predictor = DiseasePredictor(str(model_path), Path(args.vocab), Path(args.precautions))

    samples = (
        [{"name": args.name, "text": args.text, "title": "Custom case"}]
        if args.text
        else DEFAULT_SAMPLES
    )

    results = []
    for sample in samples:
        print(f"Generating figures: {sample['name']} ...")
        meta = generate_figures_for_sample(
            predictor,
            sample["text"],
            sample["name"],
            sample["title"],
            output_dir,
        )
        results.append(meta)
        for kind, path in meta["figures"].items():
            print(f"  {kind}: {path}")

    print(f"\nDone — {len(results)} sample(s), figures in {output_dir}")


if __name__ == "__main__":
    main()

#!/usr/bin/env python

import os
import sys
import yaml
from datetime import datetime
from scholarly import scholarly

def load_scholar_user_id() -> str:
    """Load the Google Scholar user ID from the configuration file."""
    config_file = "_data/socials.yml"
    if not os.path.exists(config_file):
        print(f"Configuration file {config_file} not found.")
        sys.exit(1)
    try:
        with open(config_file, "r") as f:
            config = yaml.safe_load(f)
        scholar_user_id = config.get("scholar_userid")
        if not scholar_user_id:
            print("No 'scholar_userid' found in _data/socials.yml.")
            sys.exit(1)
        return scholar_user_id
    except yaml.YAMLError as e:
        print(f"Error parsing YAML file {config_file}: {e}")
        sys.exit(1)

def update_bibtex():
    scholar_id = load_scholar_user_id()
    print(f"Fetching publications for Scholar ID: {scholar_id}")

    scholarly.set_timeout(30) # Increased timeout
    
    try:
        author = scholarly.search_author_id(scholar_id)
        author = scholarly.fill(author)
    except Exception as e:
        print(f"Error fetching author data: {e}")
        sys.exit(1)

    if not author.get("publications"):
        print("No publications found.")
        return

    bibtex_entries = []
    print(f"Found {len(author['publications'])} publications. Processing...")

    # Sort publications by year descending
    def get_year(pub):
        try:
            return int(pub['bib'].get('pub_year', 0))
        except:
            return 0
    
    author["publications"].sort(key=get_year, reverse=True)

    for pub in author["publications"]:
        try:
            # We need to fill the publication to get the bibtex
            filled_pub = scholarly.fill(pub)
            
            # Patch because scholarly/bibtexparser might fail if ENTRYTYPE is missing
            if 'ENTRYTYPE' not in filled_pub['bib']:
                filled_pub['bib']['ENTRYTYPE'] = 'article' # Default to article
            if 'ID' not in filled_pub['bib']:
                filled_pub['bib']['ID'] = filled_pub.get('author_pub_id') or filled_pub.get('pub_id') or ('pub_' + str(abs(hash(filled_pub['bib'].get('title')))))

            # Add badge fields
            # 1. HTML/Website: Use pub_url if available
            if 'pub_url' in filled_pub:
                filled_pub['bib']['html'] = filled_pub['pub_url']
            
            # 2. DOI: scholarly sometimes has it, or we might extract it from pub_url if it is a doi link
            if 'doi' not in filled_pub['bib'] and 'pub_url' in filled_pub:
                # Try to extract DOI from URL (e.g. https://doi.org/10.1016/j.jag.2021.102682)
                # or https://.../10.1016/...
                import re
                doi_match = re.search(r'(10\.\d{4,9}/[-._;()/:a-zA-Z0-9]+)', filled_pub['pub_url'])
                if doi_match:
                    filled_pub['bib']['doi'] = doi_match.group(1)
                elif 'pubs.rsc.org' in filled_pub['pub_url']:
                    # Special handling for RSC: https://pubs.rsc.org/.../d4dd00352g
                    # DOI is usually 10.1039/SUFFIX
                    parts = filled_pub['pub_url'].split('/')
                    if parts:
                        suffix = parts[-1]
                        # Verify suffix looks like a DOI suffix (alphanumeric)
                        if re.match(r'^[a-zA-Z0-9]+$', suffix):
                             filled_pub['bib']['doi'] = f"10.1039/{suffix.upper()}"
            
            # Manual overrides for known missing DOIs
            title_lower = filled_pub['bib'].get('title', '').lower()
            if "river debris detection" in title_lower and 'doi' not in filled_pub['bib']:
                 filled_pub['bib']['doi'] = "10.1016/j.jag.2022.102682"
            
            if "intrusion detection in software-defined networks" in title_lower and 'doi' not in filled_pub['bib']:
                 filled_pub['bib']['doi'] = "10.1109/ICMLCN64995.2025.11140473"
            
            if "prism: periodic representation with multiscale" in title_lower and 'doi' not in filled_pub['bib']:
                 filled_pub['bib']['doi'] = "10.21203/rs.3.rs-7828855/v1"

            # 3. Enable buttons/badges
            filled_pub['bib']['bibtex_show'] = 'true'
            filled_pub['bib']['altmetric'] = 'true'
            filled_pub['bib']['dimensions'] = 'true'
            
            # Disable badges for specific papers as requested
            title_lower = filled_pub['bib'].get('title', '').lower()
            if "garbage and debris identification" in title_lower or \
               "parameters estimation from remote sensing" in title_lower:
                filled_pub['bib']['altmetric'] = 'false'
                filled_pub['bib']['dimensions'] = 'false'
            # google_scholar_id is needed for the badge. It seems it is 'author_pub_id' or 'cites_id' component?
            # looking at bib.liquid: entry.google_scholar_id
            # and it constructs url: user=USERID&citation_for_view=USERID:ENTRY_ID
            # filled_pub['author_pub_id'] seems to be exactly that ENTRY_ID (e.g. 'Da_TlhIAAAAJ:u5HHmVD_uO8C')
            # But wait, author_pub_id includes the user id part usually?
            # Let's check what 'author_pub_id' looks like.
            # user provided example: @article{Da_TlhIAAAAJ:u5HHmVD_uO8C, ...}
            # The key is Da_TlhIAAAAJ:u5HHmVD_uO8C.
            # The bib.liquid uses entry.google_scholar_id.
            # If entry.key is Da_TlhIAAAAJ:u5HHmVD_uO8C, then google_scholar_id should probably be u5HHmVD_uO8C?
            # Or the liquid splits it? No, liquid: site.scholar_userid | append: ':' | append: entry.google_scholar_id
            # So google_scholar_id should be the part AFTER the colon if the key has the colon.
            # filled_pub['author_pub_id'] is standardly 'USERID:PUBID'.
            # We should extract the PUBID part.
            
            author_pub_id = filled_pub.get('author_pub_id')
            if author_pub_id and ':' in author_pub_id:
                 filled_pub['bib']['google_scholar_id'] = author_pub_id.split(':')[1]
            elif author_pub_id:
                 filled_pub['bib']['google_scholar_id'] = author_pub_id

            # Exclude PDF, Video, Inspire as requested
            # scholarly might put 'eprint' or 'url' that map to these?
            # We explicitly remove keys if they exist in 'bib' dictionary
            keys_to_remove = ['pdf', 'video', 'inspirehep_id']
            for k in keys_to_remove:
                if k in filled_pub['bib']:
                    del filled_pub['bib'][k]

            # Generate abbreviation (abbr)
            # Try 'journal' first, then 'conference', then 'publisher'
            venue = filled_pub['bib'].get('journal') or filled_pub['bib'].get('conference') or filled_pub['bib'].get('publisher')
            if venue:
                if 'arxiv' in venue.lower():
                    filled_pub['bib']['abbr'] = 'arXiv'
                else:
                    # Simple heuristic: First letter of each word that is uppercase
                    # e.g. "International Journal of Applied..." -> "IJAE..."
                    # Or just take first letters of words starting with capital.
                    words = venue.split()
                    abbr = "".join([w[0] for w in words if w and w[0].isupper()])
                    if abbr:
                        # Limit length just in case it gets too long
                        if len(abbr) > 10:
                            abbr = abbr[:10]
                        filled_pub['bib']['abbr'] = abbr

            # Now try to generate bibtex
            bib = scholarly.bibtex(filled_pub)
            bibtex_entries.append(bib)
            print(f"Processed: {filled_pub['bib'].get('title', 'Unknown')}")
            
        except Exception as e:
            print(f"Error processing publication: {e}")
            import traceback
            traceback.print_exc()
            continue

    output_file = "_bibliography/papers.bib"
    try:
        with open(output_file, "w", encoding="utf-8") as f:
            f.write("\n\n".join(bibtex_entries))
        print(f"Successfully updated {output_file} with {len(bibtex_entries)} entries.")
    except Exception as e:
        print(f"Error writing to {output_file}: {e}")
        sys.exit(1)

if __name__ == "__main__":
    update_bibtex()
